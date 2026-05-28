// LLM call tracing wrapper.
//
// The Overmind SDK (@overmind-lab/trace-sdk) currently auto-instruments
// OpenAI only — Anthropic provider support is not in the public API yet.
// We keep this wrapper as the call-site marker; OTel/Overmind spans drop in
// here in one place when their Anthropic instrumentation lands.

export async function traceLLMCall<T>(
  _name: string,
  _attrs: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  return fn();
}
