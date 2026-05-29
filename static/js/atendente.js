const listaManifestacoes = document.getElementById('listaManifestacoes');
const buscaManifestacao = document.getElementById('buscaManifestacao');
const filtroTipo = document.getElementById('filtroTipo');
const filtroStatus = document.getElementById('filtroStatus');
const contadorRegistros = document.getElementById('contadorRegistros');

let manifestacoes = [];

function normalizarTexto(texto) {
    return String(texto || '').toLowerCase();
}

function tipoIcone(tipo) {
    const icones = {
        Reclamação: '△',
        Sugestão: '○',
        Elogio: '♧',
        Dúvida: '?'
    };

    return icones[tipo] || '•';
}

function statusClasse(status) {
    if (status === 'Respondida') {
        return 'resolvido';
    }

    return 'aberto';
}

function renderizarTabela() {
    const termo = normalizarTexto(buscaManifestacao?.value);
    const tipoSelecionado = filtroTipo?.value || '';
    const statusSelecionado = filtroStatus?.value || '';

    const filtradas = manifestacoes.filter((item) => {
        const correspondeBusca = !termo
            || normalizarTexto(item.protocolo).includes(termo)
            || normalizarTexto(item.nome).includes(termo)
            || normalizarTexto(item.titulo).includes(termo);
        const correspondeTipo = !tipoSelecionado || item.tipo === tipoSelecionado;
        const correspondeStatus = !statusSelecionado || item.status === statusSelecionado;

        return correspondeBusca && correspondeTipo && correspondeStatus;
    });

    if (!filtradas.length) {
        listaManifestacoes.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">Nenhuma manifestação encontrada.</td>
            </tr>
        `;
    } else {
        listaManifestacoes.innerHTML = filtradas.map((item) => `
            <tr>
                <td>${item.data}</td>
                <td><strong class="protocol-cell">${item.protocolo}</strong></td>
                <td>
                    <span class="type-cell type-${normalizarTexto(item.tipo)}">
                        <span aria-hidden="true">${tipoIcone(item.tipo)}</span>
                        ${item.tipo}
                    </span>
                </td>
                <td>${item.nome}</td>
                <td>${item.titulo}</td>
                <td>
                    <span class="admin-status status-${statusClasse(item.status)}">
                        ${item.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    contadorRegistros.textContent = `Mostrando ${filtradas.length} de ${manifestacoes.length} registros`;
}

async function carregarManifestacoes() {
    const resposta = await fetch('/manifestacoes');
    manifestacoes = await resposta.json();
    renderizarTabela();
}

if (listaManifestacoes) {
    carregarManifestacoes();
}

[buscaManifestacao, filtroTipo, filtroStatus].forEach((campo) => {
    campo?.addEventListener('input', renderizarTabela);
    campo?.addEventListener('change', renderizarTabela);
});
