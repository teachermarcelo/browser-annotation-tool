# Teacher Annotate Pro

Extensão Chrome/Edge para professores: desenhe, destaque e insira anotações sobre páginas da web usando uma barra flutuante.

## Recursos
- Caneta e marca-texto
- Seta, linha, retângulo e círculo
- Inserção de texto (selecione Texto e dê duplo clique na página)
- Borracha por traço (desenhe sobre a área para apagar)
- Cor e espessura configuráveis
- Desfazer/refazer
- Mostrar/ocultar anotações
- Exportar a camada de anotações como PNG transparente
- Barra arrastável e atalho Alt+Shift+A
- Modo cursor com Esc

## Instalar no Chrome
1. Baixe ou clone este repositório.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `extension`.
6. Abra uma página web comum e clique no ícone da extensão.

## Usar
- Clique no ícone da extensão para exibir a barra.
- Escolha uma ferramenta e desenhe sobre a página.
- Escolha **Cursor** ou pressione **Esc** para interagir com os links da página.
- Use **⇩** para baixar as anotações em PNG com fundo transparente.
- Use **✕** para fechar a ferramenta.

## Limitações conhecidas
- O Chrome bloqueia extensões em páginas internas, na Chrome Web Store e em algumas páginas protegidas.
- O visualizador nativo de PDF pode ter limitações diferentes de páginas web comuns.
- Esta versão anota sobre o conteúdo visível, mas ainda não grava vídeos nem inclui automaticamente o conteúdo original da página no PNG exportado.
- O texto é inserido com duplo clique após selecionar a ferramenta Texto.
- A borracha remove pixels da camada de anotações; não altera o site original.

## Privacidade
A extensão não envia dados a servidores. As anotações existem na aba atual e são removidas quando a camada é fechada ou a página é recarregada.
