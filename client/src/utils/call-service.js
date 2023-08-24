export default async function callService(service_type, body) {
    const response = await fetch(process.env.NEXT_PUBLIC_SERVICE_URL + service_type, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const responseText = await response.text();
    if (!response.ok) {
        throw new Error(`Response status:${response.status} ${response.statusText}.Response:${responseText}`);
    }
    if (response.headers.get("content-type") === 'application/json' && responseText) {
        const res = JSON.parse(responseText);
        if (res.error) {
            throw new Error("Error:" + res.error);
            return;
        }
        return res;
    } else {
        throw new Error('Invalid response:' + responseText);
    }
}