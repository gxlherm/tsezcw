// Implementação do banco de dados usando Dexie.js
// Verificar se Dexie está disponível
if (typeof Dexie === 'undefined') {
    console.error('Erro: Biblioteca Dexie.js não carregada!');
    alert('Erro ao carregar biblioteca de banco de dados. Por favor, recarregue a página.');
}

const db = new Dexie('GuiaEncaminhamentoDB');

// Definição do esquema do banco de dados
db.version(1).stores({
    empresas: '++id, nome, cnpj',
    usuarios: '++id, username, password, nome, email, tipo',
    colaboradores: '++id, nome, cpf, rg, dataNascimento, sexo, setor, dataAdmissao, obra, matricula, funcaoId, tipoExameId',
    guias: '++id, colaboradorId, funcaoId, tipoExameId, dataCriacao, usuarioId',
    funcoes: '++id, nome, descricao, ativa',
    tiposExame: '++id, nome, descricao, ativo',
    exames: '++id, nome, recomendacao, ativo',
    riscos: '++id, tipo, descricao, ativo',
    mapeamentoFuncaoExames: '++id, funcaoId, tipoExameId, examesIds, riscosIds'
});

// Flag para controlar a inicialização
db.isInitialized = false;

// Função para inicializar o banco de dados com dados padrão
db.inicializarDadosPadrao = async function() {
    if (db.isInitialized) {
        console.log('Banco de dados já inicializado');
        return true;
    }
    
    try {
        // Verificar se já existem dados
        const empresaCount = await db.empresas.count();
        const usuariosCount = await db.usuarios.count();
        const funcoesCount = await db.funcoes.count();
        const tiposExameCount = await db.tiposExame.count();
        const examesCount = await db.exames.count();
        const riscosCount = await db.riscos.count();
        
        // Se não existirem dados, inicializar com dados padrão
        if (empresaCount === 0) {
            await db.empresas.add({
                nome: 'Empresa Exemplo',
                cnpj: '12.345.678/0001-90',
                telefone: '(11) 1234-5678',
                email: 'contato@empresa.com',
                endereco: 'Rua Exemplo, 123 - Centro - São Paulo/SP',
                medicoNome: 'Dr. João Silva',
                medicoCrm: 'CRM/SP 12345'
            });
        }
        
        if (usuariosCount === 0) {
            await db.usuarios.add({
                username: 'admin',
                password: 'admin', // Em produção, usar hash
                nome: 'Administrador',
                email: 'admin@empresa.com',
                tipo: 'admin',
                ultimoAcesso: new Date()
            });
        }
        
        if (funcoesCount === 0) {
            // Adicionar funções padrão
            const funcoes = [
                { nome: 'Auxiliar Administrativo', descricao: 'Função administrativa', ativa: true },
                { nome: 'Técnico de Segurança', descricao: 'Função técnica', ativa: true },
                { nome: 'Operador de Máquinas', descricao: 'Função operacional', ativa: true },
                { nome: 'Motorista', descricao: 'Função de transporte', ativa: true }
            ];
            
            for (const funcao of funcoes) {
                await db.funcoes.add(funcao);
            }
        }
        
        if (tiposExameCount === 0) {
            // Adicionar tipos de exame padrão
            const tiposExame = [
                { nome: 'Admissional', descricao: 'Exame realizado antes da admissão', ativo: true },
                { nome: 'Periódico', descricao: 'Exame realizado periodicamente', ativo: true },
                { nome: 'Demissional', descricao: 'Exame realizado na demissão', ativo: true },
                { nome: 'Retorno ao Trabalho', descricao: 'Exame realizado no retorno ao trabalho', ativo: true },
                { nome: 'Mudança de Função', descricao: 'Exame realizado na mudança de função', ativo: true }
            ];
            
            for (const tipo of tiposExame) {
                await db.tiposExame.add(tipo);
            }
        }
        
        if (examesCount === 0) {
            // Adicionar exames padrão
            const exames = [
                { nome: 'Hemograma Completo', recomendacao: 'Jejum de 8 horas', ativo: true },
                { nome: 'Glicemia', recomendacao: 'Jejum de 8 horas', ativo: true },
                { nome: 'Audiometria', recomendacao: 'Repouso auditivo de 14 horas', ativo: true },
                { nome: 'Acuidade Visual', recomendacao: '', ativo: true },
                { nome: 'Eletrocardiograma', recomendacao: '', ativo: true },
                { nome: 'Raio-X Tórax', recomendacao: '', ativo: true },
                { nome: 'Espirometria', recomendacao: 'Não fumar no dia do exame', ativo: true },
                { nome: 'Eletroencefalograma', recomendacao: '', ativo: true }
            ];
            
            for (const exame of exames) {
                await db.exames.add(exame);
            }
        }
        
        if (riscosCount === 0) {
            // Adicionar riscos padrão
            const riscos = [
                { tipo: 'fisico', descricao: 'Ruído', ativo: true },
                { tipo: 'fisico', descricao: 'Calor', ativo: true },
                { tipo: 'fisico', descricao: 'Radiação não ionizante', ativo: true },
                { tipo: 'quimico', descricao: 'Poeira', ativo: true },
                { tipo: 'quimico', descricao: 'Produtos químicos', ativo: true },
                { tipo: 'biologico', descricao: 'Vírus', ativo: true },
                { tipo: 'biologico', descricao: 'Bactérias', ativo: true },
                { tipo: 'ergonomico', descricao: 'Postura inadequada', ativo: true },
                { tipo: 'ergonomico', descricao: 'Movimentos repetitivos', ativo: true },
                { tipo: 'acidentes', descricao: 'Queda de mesmo nível', ativo: true },
                { tipo: 'acidentes', descricao: 'Choque elétrico', ativo: true }
            ];
            
            for (const risco of riscos) {
                await db.riscos.add(risco);
            }
        }
        
        // Verificar se já existem mapeamentos
        const mapeamentoCount = await db.mapeamentoFuncaoExames.count();
        
        if (mapeamentoCount === 0) {
            // Obter IDs das funções e tipos de exame
            const funcoes = await db.funcoes.toArray();
            const tiposExame = await db.tiposExame.toArray();
            const exames = await db.exames.toArray();
            const riscos = await db.riscos.toArray();
            
            // Criar mapeamentos padrão
            // Para cada função, mapear exames e riscos para cada tipo de exame
            for (const funcao of funcoes) {
                for (const tipoExame of tiposExame) {
                    // Selecionar alguns exames aleatoriamente para cada combinação
                    const examesSelecionados = exames
                        .filter(() => Math.random() > 0.5)
                        .map(exame => exame.id);
                    
                    // Selecionar alguns riscos aleatoriamente para cada combinação
                    const riscosSelecionados = riscos
                        .filter(() => Math.random() > 0.6)
                        .map(risco => risco.id);
                    
                    // Adicionar mapeamento
                    if (examesSelecionados.length > 0 && riscosSelecionados.length > 0) {
                        await db.mapeamentoFuncaoExames.add({
                            funcaoId: funcao.id,
                            tipoExameId: tipoExame.id,
                            examesIds: examesSelecionados.join(';'),
                            riscosIds: riscosSelecionados.join(';')
                        });
                    }
                }
            }
        }
        
        // Marcar como inicializado
        db.isInitialized = true;
        console.log('Banco de dados inicializado com sucesso');
        
        // Disparar evento de inicialização concluída
        const event = new CustomEvent('db-initialized');
        document.dispatchEvent(event);
        
        return true;
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        throw error;
    }
};

// Função para obter exames e riscos por função e tipo de exame
db.obterExamesPorFuncaoETipo = async function(funcaoId, tipoExameId) {
    try {
        // Garantir que o banco de dados esteja inicializado
        if (!db.isInitialized) {
            await db.inicializarDadosPadrao();
        }
        
        // Buscar o mapeamento
        const mapeamento = await db.mapeamentoFuncaoExames
            .where({funcaoId: funcaoId, tipoExameId: tipoExameId})
            .first();
        
        if (!mapeamento) {
            return {
                exames: [],
                riscos: []
            };
        }
        
        // Obter IDs dos exames e riscos
        const examesIds = mapeamento.examesIds.split(';').map(id => parseInt(id));
        const riscosIds = mapeamento.riscosIds.split(';').map(id => parseInt(id));
        
        // Buscar exames e riscos
        const exames = await db.exames.where('id').anyOf(examesIds).toArray();
        const riscos = await db.riscos.where('id').anyOf(riscosIds).toArray();
        
        return {
            exames: exames,
            riscos: riscos
        };
    } catch (error) {
        console.error('Erro ao obter exames e riscos:', error);
        return {
            exames: [],
            riscos: []
        };
    }
};

// Inicializar o banco de dados ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar se já foi inicializado pelo app.js
        if (!db.isInitialized) {
            console.log('Inicializando banco de dados a partir do db.js');
            await db.inicializarDadosPadrao();
        }
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        showToast('Erro ao inicializar banco de dados. Tente recarregar a página.', 'danger');
    }
});

// Exportar o objeto db
window.db = db;
