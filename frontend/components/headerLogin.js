class HeaderLogin extends HTMLElement {
	// ...existing code...

	connectedCallback() {
		// tentar encontrar o alvo onde será setado o innerHTML
		const targetSelectorCandidates = [
			'.header-container',
			'#header',
			'.header',
			this // fallback para o próprio custom element
		];

		let target = null;
		for (const sel of targetSelectorCandidates) {
			if (typeof sel === 'string') {
				target = this.querySelector(sel) || document.querySelector(sel);
			} else {
				// sel == this
				target = this;
			}
			if (target) break;
		}

		if (!target) {
			console.warn('Header: elemento alvo não encontrado. Pulando renderização do header.');
			return;
		}

		// Exemplo: renderizar conteúdo com segurança
		try {
			target.innerHTML = `
				<!-- conteúdo do header (reduzir/ajustar conforme sua implementação) -->
				<nav class="header-content">
					<a href="/frontend/paginas/home/home.html">Home</a>
					<!-- ...outros itens... -->
				</nav>
			`;
		} catch (err) {
			console.error('Erro ao renderizar header:', err);
		}
	}

	// ...existing code...
}

customElements.define('header-login', HeaderLogin);