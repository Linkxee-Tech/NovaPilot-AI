import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def verify_system():
    print("Verifying system components...")
    
    # 1. Check Imports
    try:
        import boto3
        from playwright.async_api import async_playwright
        print("✅ Dependencies (boto3, playwright) found.")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        return

    # 2. Check Browser Agent Initialization
    from app.agents.browser import browser_agent
    print(f"✅ Browser Agent initialized: {browser_agent.name}")
    
    # 3. Check Orchestrator Initialization
    from app.agents.orchestrator import NovaActOrchestrator
    try:
        orchestrator = NovaActOrchestrator()
        print("✅ Orchestrator initialized.")
    except Exception as e:
        print(f"⚠️ Orchestrator initialization warning (check AWS creds): {e}")

    print("\nSystem verification complete.")

if __name__ == "__main__":
    try:
        asyncio.run(verify_system())
    except Exception as e:
        print(f"❌ Verification failed: {e}")
