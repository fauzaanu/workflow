addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const req = await request.json();

  const replicateReq = {
    method: 'POST',
    headers: {
      'Authorization': 'Token ' + 'REPLICATE_API_TOKEN',  // Replace 'REPLICATE_API_TOKEN' with the actual token
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: req.model,
      input: {
        top_k: 40,
        top_p: 0.75,
        prompt: req.messages.filter(msg => msg.role === 'user')[0].content,
        temperature: 0.01,
        system_prompt: req.messages.filter(msg => msg.role === 'system')[0].content,
        max_new_tokens: -1,
        prompt_template: '',
      }
    })
  };

  const response = await fetch('https://api.replicate.com/v1/predictions', replicateReq);
  const replicateResponse = await response.json();

  const responseBody = {
    choices: [{
      finish_reason: 'stop',
      index: 0,
      message: {
        content: replicateResponse.output.join('').trim(),
        role: 'assistant',
      },
      logprobs: null,
    }],
    created: Date.now(),
    id: replicateResponse.id,
    model: replicateResponse.version,
    object: 'chat.completion',
    usage: {
      completion_tokens: replicateResponse.output.length,
      prompt_tokens: req.messages.length,
      total_tokens: replicateResponse.output.length + req.messages.length,
    },
  };


  return new Response(JSON.stringify(responseBody), response);
}
