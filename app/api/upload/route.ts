// Remove entire upload endpoint since profile pictures are not supported
export const runtime = 'edge';

export async function POST() {
  return new Response(JSON.stringify({ error: 'Profile picture uploads are disabled' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  });
}
