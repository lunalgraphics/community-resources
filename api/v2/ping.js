export function GET(request) {
    return new Response(JSON.stringify({
        message: "hi guys"
    }), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        }
    });
}