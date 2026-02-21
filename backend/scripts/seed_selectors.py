from sqlalchemy.orm import Session
from app.models.selector import Selector
from app.core.db import SessionLocal

def seed_selectors():
    db = SessionLocal()
    selectors = [
        {"platform": "LinkedIn", "element_name": "post_box", "selector_value": "div[aria-label='Start a post']"},
        {"platform": "LinkedIn", "element_name": "submit_button", "selector_value": "button.share-actions__primary-action"},
        {"platform": "Twitter", "element_name": "tweet_box", "selector_value": "div[aria-label='Tweet text']"},
        {"platform": "Twitter", "element_name": "tweet_button", "selector_value": "data-testid='tweetButtonInline'"}
    ]
    
    for s in selectors:
        exists = db.query(Selector).filter_by(platform=s["platform"], element_name=s["element_name"]).first()
        if not exists:
            db_selector = Selector(**s)
            db.add(db_selector)
    
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_selectors()
    print("Selectors seeded!")
