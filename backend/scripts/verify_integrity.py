import hashlib
import json
import sys

def verify_audit_record(record_json: dict):
    """
    Verifies a single audit record against its evidence_hash.
    Hash is computed from trace_id, action, and JSON-stringified details.
    """
    trace_id = record_json.get("trace_id")
    action = record_json.get("action")
    details = record_json.get("details", {})
    stored_hash = record_json.get("evidence_hash")
    
    details_str = json.dumps(details, sort_keys=True) if details else ""
    computed_hash = hashlib.sha256(f"{trace_id}:{action}:{details_str}".encode()).hexdigest()
    
    if computed_hash == stored_hash:
        return True, computed_hash
    else:
        return False, computed_hash

if __name__ == "__main__":
    # Example usage: python verify_integrity.py "{...record...}"
    if len(sys.argv) < 2:
        print("Usage: python verify_integrity.py '<json_record>'")
        sys.exit(1)
        
    try:
        record = json.loads(sys.argv[1])
        is_valid, computed = verify_audit_record(record)
        if is_valid:
            print(f"✅ Integrity Verified! Hash: {computed}")
        else:
            print(f"❌ INTEGRITY BREACH! Stored: {record.get('evidence_hash')}, Computed: {computed}")
    except Exception as e:
        print(f"Error parsing record: {e}")
