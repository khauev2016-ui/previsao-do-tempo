# Previsão do Tempo com Inteligência Artificial

Projeto em HTML, CSS e JavaScript que consome a API do OpenWeather para exibir informações climáticas de uma cidade e utiliza a API do Groq (LLaMA 3.3 70B) para gerar análises e recomendações inteligentes baseadas na previsão.

## Funcionalidades

- **Busca de Clima:** Busca o clima em tempo real pelo nome da cidade.
- **Informações Exibidas:** Temperatura, descrição do clima, umidade e velocidade do vento.
- **Previsão:** Previsão do tempo detalhada para os próximos 5 dias.
- **Análise de IA Automática (Groq):**
  - Disparada automaticamente após a busca dos dados climáticos.
  - Envia os dados atuais e a previsão de 5 dias para o modelo **LLaMA 3.3 70B**.
  - Retorna um JSON estruturado com alertas por severidade, análise geral e recomendações.
  - Sistema de alertas colorido por níveis: `danger` (vermelho), `warning` (amarelo), `info` (azul) e `ok` (verde).
  - Tratamento de erros robusto para chaves inválidas, rate limit e falhas de rede.

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- [OpenWeather API](https://openweathermap.org/api)
- [Groq Cloud API](https://console.groq.com/) (Modelo LLaMA 3.3 70B)
- Font Awesome (Ícones dos cards de alerta)

## Configuração e Como Usar

### 1. Clonar e Executar o Projeto

1. Baixe ou clone este repositório.
2. Abra a pasta no seu editor de código (ex: VS Code).
3. Instale a extensão **Live Server** (caso não tenha).
4. Clique com o botão direito no arquivo `index.html` e selecione **Open with Live Server**.

### 2. Configurar a API do OpenWeather

1. Acesse o site do [OpenWeather](https://openweathermap.org/api) e crie uma conta.
2. Gere sua API Key no painel da plataforma.
3. No arquivo `script.js`, substitua o valor da constante:

```javascript
const API_KEY = "SUA_CHAVE_OPENWEATHER_AQUI";
```

### 3. Configurar a IA do Groq (Interface)

Não é necessário expor sua chave do Groq no código fonte. A configuração é feita diretamente pela interface do usuário:

1. Acesse o [Groq Console](https://console.groq.com/) e crie uma API Key (`gsk_...`).
2. Na tela do projeto, clique na barra "Análise de IA — Groq" para expandir o painel.
3. Cole sua chave no campo indicado e clique em Salvar.
4. A chave será salva com segurança no `localStorage` do navegador (persiste entre sessões).
5. O badge de status mudará para "Ativo" e as análises serão geradas automaticamente a cada nova busca.

## Estrutura do Projeto

```plaintext
/projeto
│── index.html    # Estrutura da página, barra do Groq e seção de resultados da IA
│── script.js     # Lógica de consumo das APIs (OpenWeather/Groq) e manipulação do DOM
```

## Observações

- O projeto utiliza unidades em Celsius.
- O idioma da API do OpenWeather está configurado para português.
- É necessária uma conexão ativa com a internet para o funcionamento de ambas as APIs.
- Projeto desenvolvido para fins de aprendizado.