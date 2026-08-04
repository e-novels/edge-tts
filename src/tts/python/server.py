import sys
import json
import base64

def handle_request(request):
    method = request.get("method")
    params = request.get("params", {})
    if method == "getVoices":
        return {"voices": [{"id": "default", "name": "Default Python Voice", "lang": "vi-VN"}]}
    elif method == "speak":
        text = params.get("text", "")
        # Dummy 1-second silent WAV audio file for demonstration
        header = (
            b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00"
            b"\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
        )
        return {
            "audio": base64.b64encode(header).decode("ascii"),
            "mimeType": "audio/wav"
        }
    elif method == "stop":
        return {"success": True}
    else:
        raise ValueError(f"Unknown method: {method}")

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
            result = handle_request(request)
            response = {"id": request.get("id"), "result": result}
        except Exception as e:
            response = {"id": request.get("id"), "error": str(e)}
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()

if __name__ == "__main__":
    main()
