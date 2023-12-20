addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
	const req = await request.json();
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
		}
	};

	return new Response(JSON.stringify(responseBody), response);
}
