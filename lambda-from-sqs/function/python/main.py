import json
import os
import requests
from typing import Any, Dict


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    url: str = os.environ.get('URL')
    token: str = os.environ.get('TOKEN')

    print(f"[INFO] Url: {url}")


    try:
        body: str = json.loads(event["Records"][0]["body"])
        print(f"[INFO] Body: {body}")

        headers: Dict[str, str] = {
            "Authorization": f"Basic {token}",
        }

        response: requests.Response = requests.post(url, json=body, headers=headers)
        print(f"[INFO] Response: {response.text}")

        return {
            "headers": { "Content-Type": "application/json" },
            "body": response.json(),
            "statusCode": 200,
        }
    except Exception as e:
        print(f"[ERRO] Error forwarding request: {e}")
        return {
            "headers": { "Content-Type": "application/json" },
            "body": e,
            "statusCode": 400,
        }
