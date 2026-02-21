import logging
import asyncio
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright, Page, Browser
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class BrowserExecutor:
    def __init__(self):
        self._browser: Optional[Browser] = None
        self._playwright = None
        self._page: Optional[Page] = None

    async def start(self):
        if not self._playwright:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=False,  # Visible for debugging/demo, can be True in prod
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            self._page = await self._browser.new_page()

    async def stop(self):
        if self._page:
            await self._page.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()

    async def execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a single action step.
        """
        if not self._page:
            await self.start()

        action_type = action.get("type")
        selector = action.get("selector")
        value = action.get("value")
        url = action.get("url")

        result = {
            "action": action,
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "screenshot": None
        }

        try:
            if action_type == "navigate":
                await self._page.goto(url, timeout=30000)
            
            elif action_type == "click":
                await self._page.click(selector)
            
            elif action_type == "type":
                await self._page.fill(selector, value)
            
            elif action_type == "wait":
                await self._page.wait_for_timeout(float(value or 1000))
            
            elif action_type == "screenshot":
                path = f"evidence_{datetime.now().timestamp()}.png"
                await self._page.screenshot(path=path)
                result["screenshot"] = path

            # Always take a screenshot on failure or critical steps (customizable)
            
        except Exception as e:
            logger.error(f"Browser Action Failed: {e}")
            result["status"] = "failed"
            result["error"] = str(e)
            
            # Capture failure state
            fail_path = f"error_{datetime.now().timestamp()}.png"
            try:
                await self._page.screenshot(path=fail_path)
                result["screenshot"] = fail_path
            except:
                pass

        return result
