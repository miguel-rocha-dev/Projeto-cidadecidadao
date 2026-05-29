const form = document.getElementById('formManifestacao');
const resultado = document.getElementById('resultado');

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function renderManifestacaoSucesso(protocolo) {
    const protocoloTexto = protocolo || '2024-ABC123';
    const protocoloSeguro = escapeHtml(protocoloTexto);
    const consultaUrl = `/consultar_protocolo?protocolo=${encodeURIComponent(protocoloTexto)}`;

    resultado.className = 'resultado success-feedback';
    resultado.innerHTML = `
        <div class="success-card">
            <div class="success-icon-wrap">
                <span class="success-icon" aria-hidden="true">✓</span>
            </div>

            <h2>Sua manifestação foi registrada com sucesso!</h2>
            <p class="success-message">
                Agradecemos sua contribuição para uma Cidade Cidadã.
                Abaixo está o número do seu protocolo, guarde-o para
                acompanhar o andamento da sua solicitação.
            </p>

            <div class="protocol-copy-box">
                <div>
                    <span>Número do Protocolo</span>
                    <strong>${protocoloSeguro}</strong>
                </div>
                <button type="button" class="copy-protocol-btn" data-protocolo="${protocoloSeguro}">
                    <span aria-hidden="true">▣</span>
                    Copiar Protocolo
                </button>
            </div>

            <a class="success-action primary" href="${consultaUrl}">
                <span aria-hidden="true">⌕</span>
                Consultar Status Agora
            </a>
            <a class="success-action secondary" href="/">
                <span aria-hidden="true">⌂</span>
                Voltar ao Início
            </a>

            <p class="success-note">
                <span aria-hidden="true">i</span>
                Um e-mail de confirmação foi enviado para o endereço cadastrado.
            </p>
        </div>
    `;

    form.style.display = 'none';
    form.closest('.form-card')?.classList.add('success-mode');
    resultado.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dados = {
            tipo_id: document.getElementById('tipo').value,
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value
        };

        try {
            const resposta = await fetch('/manifestacao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });

            const json = await resposta.json();

            renderManifestacaoSucesso(json.protocolo);
            form.reset();
        } catch (erro) {
            resultado.className = 'resultado';
            resultado.innerHTML = '<p>Erro ao registrar manifestação.</p>';
        }
    });
}

document.addEventListener('click', async (event) => {
    const button = event.target.closest('.copy-protocol-btn');

    if (!button) {
        return;
    }

    try {
        await navigator.clipboard.writeText(button.dataset.protocolo);
        button.innerHTML = '<span aria-hidden="true">✓</span> Copiado';
    } catch (erro) {
        button.innerHTML = '<span aria-hidden="true">!</span> Não copiado';
    }
});

const btnConsultar = document.getElementById('btnConsultar');
const protocoloConsulta = document.getElementById('protocoloConsulta');

if (protocoloConsulta) {
    const parametros = new URLSearchParams(window.location.search);
    const protocoloUrl = parametros.get('protocolo');

    if (protocoloUrl) {
        protocoloConsulta.value = protocoloUrl;
    }
}

if (btnConsultar) {
    btnConsultar.addEventListener('click', async () => {
        const protocolo = document.getElementById('protocoloConsulta').value;

        try {
            const resposta = await fetch(`/manifestacao/${encodeURIComponent(protocolo)}`);
            const dados = await resposta.json();

            document.getElementById('consultaResultado').innerHTML = `
                <h3>Status da Manifestação</h3>
                <p><strong>Status:</strong> ${dados.status}</p>
                <p><strong>Resposta:</strong> ${dados.resposta || 'Ainda não respondida.'}</p>
            `;
        } catch (erro) {
            document.getElementById('consultaResultado').innerHTML = `
                <p>Manifestação não encontrada.</p>
            `;
        }
    });
}
