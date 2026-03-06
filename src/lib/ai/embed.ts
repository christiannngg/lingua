/**
 * embed.ts
 *
 * Calls the Voyage AI embeddings API and returns a float array.
 * Model: voyage-3-lite (512 dimensions)
 *
 * Docs: https://docs.voyageai.com/reference/embeddings-api
 */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3-lite";

export async function embedText(
  text: string,
  inputType: "document" | "query" = "document",
): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set");

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: inputType,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voyage AI error ${response.status}: ${error}`);
  }

  const data = (await response.json()) as {
    data: { embedding: number[] }[];
  };

  const embedding = data.data[0]?.embedding;
  if (!embedding) throw new Error("Voyage AI returned no embedding");

  return embedding;
}