import logging
import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from playwright.async_api import async_playwright, Browser, Page

logger = logging.getLogger(__name__)

class BrowserAgent:
    def __init__(self):
        self.name = "PlaywrightHeadlessAgent"
        self._browser: Optional[Browser] = None
        self._playwright = None

    async def _init_browser(self):
        if not self._browser:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=False,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )

    async def run_session(self, actions: List[Dict[str, Any]], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Executes a series of browser actions using Playwright.
        """
        if not actions:
             return {"status": "no_actions", "error": "No actions provided"}

        await self._init_browser()
        context_opts = context or {}
        page = await self._browser.new_page()
        
        results = {
            "status": "running",
            "logs": [],
            "screenshot_taken": False,
            "start_time": datetime.utcnow().isoformat()
        }

        try:
            for action in actions:
                action_type = action.get('type')
                selector = action.get('selector')
                value = action.get('value')
                
                log_entry = f"Executing: {action_type} {selector or ''}"
                logger.info(log_entry)
                results["logs"].append(log_entry)

                if action_type == 'navigate':
                    await page.goto(action.get('url'), timeout=30000)
                
                elif action_type == 'click':
                    await page.click(selector)
                
                elif action_type == 'type':
                    await page.fill(selector, value)
                
                elif action_type == 'wait':
                    await page.wait_for_timeout(float(value or 1000))
                    
                elif action_type == 'screenshot':
                    await page.screenshot(path=f"evidence_{datetime.now().timestamp()}.png")
                    results["screenshot_taken"] = True

                # Basic anti-bot measures (random delay)
                await page.wait_for_timeout(500)

            results["status"] = "completed"
            
        except Exception as e:
            logger.error(f"Browser Execution Failed: {e}")
            results["status"] = "failed"
            results["error"] = str(e)
            # Capture error state
            try:
                await page.screenshot(path=f"error_evidence_{datetime.now().timestamp()}.png")
                results["screenshot_taken"] = True
            except:
                pass
        
        finally:
            await page.close()
            # In a persistent worker, we might keep the browser open, 
            # but for this MVP we close context to save resources.
            
        return results

    async def cleanup(self):
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()

browser_agent = BrowserAgent()
