# VOZÊ Karaokê — Hospedagem grátis no Render

**Servidor publicado:** https://voze-karaoke-gxlherm.onrender.com

**Origem:** branch `voze-karaoke` (separada da branch principal). O código desta branch é público porque a conexão do Render não conseguiu acessar o repositório privado NexoTv.

## Implantação

Serviço Render: https://dashboard.render.com/web/srv-dbddrv4s728c73bjk740

- Plano: **free**, sem upgrade autorizado.
- Repositório: `gxlherm/tsezcw`, branch `voze-karaoke`.
- Build: `node --version`.
- Start: `node voze-host/server.mjs`.
- Porta: variável `PORT` fornecida pelo Render.
- Verificar serviço: `https://voze-karaoke-gxlherm.onrender.com/health`.
- Homepage (iOS/Android): `https://voze-karaoke-gxlherm.onrender.com/`.
- Deploy automático para novos commits nesta branch.

## Integração Roku

O arquivo ZIP sideload Roku precisa conter a função `KaraokeServerBase` em `source/config.brs` com:

```brightscript
function KaraokeServerBase() as String
    return "https://voze-karaoke-gxlherm.onrender.com"
end function
```

O ZIP configurado foi gerado na conversa do ChatGPT. É independente do aplicativo NEXO TV; instalar por sideload substitui temporariamente o canal de desenvolvimento anterior.

## Limitações importantes

1. O telefone funciona como microfone de **análise de afinação** e controle. A voz captada **não é amplificada na Roku**.
2. Os demonstrativos musicais (2) são locais no ZIP Roku; não há catálogo comercial.
3. O armazenamento de sessões é em memória; reinicializações do Render invalidam os códigos. O free service pode adormecer.
4. Hospedagem Web HTTPS registrada como live pelo Render. Ainda falta validar conexão real da Roku e microfone físico do Safari/Chrome.
5. Tokens de pareamento e rate limiting são experimentais; não recomendado para uso público de escala. Nenhum áudio de voz é enviado ao servidor.

## Uso

1. Instale o ZIP configurado no modo desenvolvedor Roku.
2. Abra o app VOZÊ na Roku e espere o código numérico.
3. Abra o endereço HTTPS acima no Safari iOS ou Chrome Android.
4. Insira o código e conceda acesso ao microfone.
5. Escolha uma das duas faixas, toque Play e confira a pontuação na TV.

O projeto **não requer domínio próprio nem cartão** no plano gratuito do Render já escolhido.
