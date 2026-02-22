import logging
import json
from datetime import datetime, timezone
from typing import Dict, Any, List
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.aws import get_aws_client
from app.core.exceptions import PlatformError
from app.services.nova.browser_executor import BrowserExecutor
from jsonschema import validate, ValidationError
from app.models.error_codes import ErrorCode

logger = logging.getLogger(__name__)
AUTH_ERROR_CODES = {"UnrecognizedClientException", "InvalidClientTokenId", "ExpiredTokenException"}

class NovaActService:
    def __init__(self):
        self.demo_mode = settings.DEMO_MODE
        self.client = None
        if not self.demo_mode:
            self.client = get_aws_client("bedrock-runtime")
        self.model_id = settings.NOVA_ACT_MODEL_ID
        self.browser = None if self.demo_mode else BrowserExecutor()

    @staticmethod
    def _is_auth_error(exc: ClientError) -> bool:
        code = exc.response.get("Error", {}).get("Code")
        return code in AUTH_ERROR_CODES

    def _refresh_client(self) -> None:
        if not self.demo_mode:
            self.client = get_aws_client("bedrock-runtime")

    def _converse_with_retry(self, **kwargs) -> dict:
        if self.client is None:
            raise RuntimeError("Bedrock client is unavailable")
        try:
            return self.client.converse(**kwargs)
        except ClientError as exc:
            if not self._is_auth_error(exc):
                raise

            code = exc.response.get("Error", {}).get("Code", "Unknown")
            logger.warning("Bedrock auth error (%s). Refreshing client and retrying once.", code)
            self._refresh_client()

            try:
                return self.client.converse(**kwargs)
            except ClientError as retry_exc:
                if self._is_auth_error(retry_exc):
                    raise PlatformError(
                        "AWS credentials/token invalid for Bedrock. "
                        "Run `aws sts get-caller-identity` and restart the backend."
                    )
                raise

    def validate_nova_response(self, response: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates the Nova response against a JSON schema.
        """
        try:
            validate(instance=response, schema=schema)
            return response
        except ValidationError as e:
            logger.error(f"Nova Response Validation Failed: {e.message}")
            raise ValueError(f"Invalid Nova Response: {e.message}")

    async def _get_execution_plan(self, goal: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Consults Amazon Nova to generate a plan of actions.
        """
        if self.demo_mode:
            return [
                {
                    "type": "navigate",
                    "url": "https://example.com/demo-social-publisher",
                },
                {
                    "type": "type",
                    "selector": "#content",
                    "value": context.get("content", f"Demo automation for: {goal}")[:280],
                },
                {
                    "type": "click",
                    "selector": "#publish",
                },
                {
                    "type": "screenshot",
                },
            ]
        from app.services.nova.prompts import NOVA_ACT_SYSTEM_PROMPT, get_automation_prompt
        
        prompt = get_automation_prompt(goal, json.dumps(context))

        try:
            response = self._converse_with_retry(
                modelId=self.model_id,
                system=[{"text": NOVA_ACT_SYSTEM_PROMPT}],
                messages=[{
                    "role": "user",
                    "content": [{"text": prompt}]
                }],
                inferenceConfig={
                    "maxTokens": 2048,
                    "temperature": 0.1
                }
            )

            response_text = response['output']['message']['content'][0]['text']
            
            # Clean up markdown
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            plan = json.loads(response_text)
            
            # Validate Schema
            ACTION_SCHEMA = {
                "type": "object",
                "properties": {
                    "actions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "type": {"type": "string", "enum": ["navigate", "click", "type", "wait", "screenshot"]},
                                "selector": {"type": "string"},
                                "value": {"type": "string"},
                                "url": {"type": "string"}
                            },
                            "required": ["type"]
                        }
                    }
                },
                "required": ["actions"]
            }
            
            self.validate_nova_response(plan, ACTION_SCHEMA)
            
            return plan.get("actions", [])

        except Exception as e:
            logger.error(f"Nova Act Planning Failed: {e}")
            raise

    async def execute_goal(self, goal: str, context: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Orchestrates the full goal execution: Plan -> Execute -> Audit.
        """
        if self.demo_mode:
            actions = await self._get_execution_plan(goal, context)
            steps = []
            for action in actions:
                steps.append(
                    {
                        "action": action,
                        "status": "success",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "screenshot": "demo_evidence.png" if action.get("type") == "screenshot" else None,
                    }
                )
            return {
                "goal": goal,
                "status": "success",
                "steps": steps,
                "error": None,
                "error_code": None,
                "mode": "demo",
            }

        audit_log = {
            "goal": goal,
            "status": "pending",
            "steps": [],
            "error": None,
            "error_code": None
        }

        try:
            # 1. Get Plan
            try:
                actions = await self._get_execution_plan(goal, context)
            except Exception as e:
                audit_log["status"] = "failed"
                audit_log["error"] = f"Planning failed: {str(e)}"
                audit_log["error_code"] = ErrorCode.SYSTEM_ERROR
                return audit_log
            
            # 2. Execute Actions
            try:
                if not self.browser:
                    raise RuntimeError("Browser executor is unavailable")
                await self.browser.start()
                
                for action in actions:
                    step_result = await self.browser.execute_action(action)
                    audit_log["steps"].append(step_result)
                    
                    if step_result["status"] == "failed":
                        # Categorize error
                        error_msg = step_result.get('error', '').lower()
                        if "timeout" in error_msg:
                            audit_log["error_code"] = ErrorCode.TIMEOUT
                        elif "selector" in error_msg:
                            audit_log["error_code"] = ErrorCode.SELECTOR_NOT_FOUND
                        else:
                            audit_log["error_code"] = ErrorCode.SYSTEM_ERROR
                            
                        raise Exception(f"Action failed: {step_result.get('error')}")

                audit_log["status"] = "success"

            except Exception as e:
                audit_log["status"] = "failed"
                audit_log["error"] = str(e)
                if not audit_log["error_code"]:
                    audit_log["error_code"] = ErrorCode.SYSTEM_ERROR
            
            finally:
                await self.browser.stop()

        except Exception as e:
            audit_log["status"] = "failed"
            audit_log["error"] = f"Unexpected error: {str(e)}"
            audit_log["error_code"] = ErrorCode.SYSTEM_ERROR
            
        return audit_log
