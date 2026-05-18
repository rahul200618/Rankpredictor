// Gemini AI endpoint removed
export default async function handler(req: Request) {
    return new Response(JSON.stringify({ error: "AI features are disabled." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
    });
}
