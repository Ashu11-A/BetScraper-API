<div align="center">

# BetScraper

![license-info](https://img.shields.io/github/license/Ashu11-A/AST-Shell?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-infoa](https://img.shields.io/github/stars/Ashu11-A/BetScraper-API?colorA=302D41&colorB=f9e2af&style=for-the-badge)

![Last-Comitt](https://img.shields.io/github/last-commit/Ashu11-A/BetScraper-API?style=for-the-badge&colorA=302D41&colorB=b4befe)
![Comitts Year](https://img.shields.io/github/commit-activity/y/Ashu11-A/BetScraper-API?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![reposize-info](https://img.shields.io/github/languages/code-size/Ashu11-A/BetScraper-API?style=for-the-badge&colorA=302D41&colorB=90dceb)

![SourceForge Languages](https://img.shields.io/github/languages/top/Ashu11-A/BetScraper-API?style=for-the-badge&colorA=302D41&colorB=90dceb)

![output](https://github.com/user-attachments/assets/434c423b-3d12-42d1-aa53-262986e2583c)

</div>
<div align="left">

# Ferramenta para Monitoramento de Plataformas Digitais de Apostas

Este repositório contém o código-fonte e a documentação de uma aplicação desenvolvida para o monitoramento periódico de plataformas digitais de apostas. A ferramenta foi projetada para verificar a conformidade dos sites de apostas com a legislação brasileira, especialmente no que diz respeito à exibição das cláusulas de advertência sobre restrição etária e riscos associados à atividade.

## Sumário

- [Introdução](#introdução)
- [Objetivo](#objetivo)
- [Fundamentação e Tecnologias Utilizadas](#fundamentação-e-tecnologias-utilizadas)
  - [OCR – Reconhecimento Ótico de Caracteres](#ocr---reconhecimento-ótico-de-caracteres)
  - [Web Scraping](#web-scraping)
  - [Filas de Processamento (Queues)](#filas-de-processamento-queues)
  - [Cron Job](#cron-job)
- [Metodologia](#metodologia)
- [Desenvolvimento do Software](#desenvolvimento-do-software)
  - [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
  - [Tecnologias e Ferramentas](#tecnologias-e-ferramentas)
  - [Fluxo de Processamento da Aplicação](#fluxo-de-processamento-da-aplicação)
- [Dependências e Solução de Problemas](#dependências-e-solução-de-problemas)
- [Limitações e Desafios](#limitações-e-desafios)
- [Considerações Finais e Aprimoramentos Futuros](#considerações-finais-e-aprimoramentos-futuros)
- [Referências](#referências)
- [Licença](#licença)

---

## Introdução

A popularização das apostas de quota fixa, tanto no Brasil quanto em nível internacional, tem impulsionado a necessidade de regulamentação e fiscalização mais rigorosas dos sítios eletrônicos dos operadores. Em especial, verifica-se a importância da presença de cláusulas de advertência relativas à restrição etária e aos riscos financeiros inerentes à atividade. Com o intuito de facilitar a verificação do cumprimento dessas normas, o projeto propõe o desenvolvimento de um software capaz de identificar, de forma automática e padronizada, se estas cláusulas estão presentes e visíveis nas páginas iniciais dos sites de apostas.

## Objetivo

O principal objetivo desta ferramenta é assegurar que os sites de apostas cumpram as exigências legais quanto à exibição das cláusulas de advertência:
- **Restrição Etária**: Verificar a presença de expressões como “18+” e “proibido para menores de 18 anos”.
- **Avisos de Risco**: Identificar declarações padronizadas de alerta, tais como “jogue com responsabilidade”, “apostas não são investimento”, entre outros, conforme definido nas normas e na regulamentação publicitária.

Dessa forma, o software possibilita que os órgãos reguladores e consumidores possam facilmente confirmar que as informações necessárias estão disponíveis e apresentadas de forma clara e acessível.

## Fundamentação e Tecnologias Utilizadas

A implementação da ferramenta baseia-se em diversas técnicas e tecnologias modernas. A seguir, destacam-se os principais fundamentos:

### OCR – Reconhecimento Ótico de Caracteres

- **Descrição**: Tecnologia que permite converter imagens em dados textuais processáveis por sistemas computacionais.
- **Aplicação**: Utilizado para extrair textos de elementos visuais (por exemplo, banners e imagens) presentes nos sites de apostas.
- **Ferramenta Utilizada**: PaddleOCR, que se destaca por sua robustez e capacidade de lidar com textos complexos e múltiplos idiomas.

### Web Scraping

- **Descrição**: Técnica automatizada para extração de dados de páginas web.
- **Aplicação**: A ferramenta utiliza web scraping para capturar o HTML e imagens das páginas iniciais dos sítios de apostas, utilizando a biblioteca Puppeteer baseada em Node.js.
- **Desafios**: Lida com mudanças constantes de layout, medidas anti-scraping (como CAPTCHAs e bloqueios de IP) e atualizações frequentes dos conteúdos.

### Filas de Processamento (Queues)

- **Descrição**: Utilização de filas no modelo FIFO (First In, First Out) para gerenciar e processar as tarefas de scraping de forma ordenada.
- **Aplicação**: Garante que as requisições de monitoramento sejam executadas de forma sequencial e eficiente, evitando sobrecarga do sistema.

### Cron Job

- **Descrição**: Tarefas agendadas que permitem a execução periódica dos processos de scraping e análise.
- **Aplicação**: Utilizado para agendar a coleta de dados dos sítios de apostas em intervalos regulares (ex.: a cada 6 ou 12 horas), garantindo monitoramento contínuo e atualização dos dados.

## Metodologia

A abordagem metodológica adotada para o desenvolvimento da ferramenta incluiu os seguintes passos:

1. **Coleta de Dados**: Identificação dos sítios eletrônicos autorizados, utilizando listas oficiais e consolidação dos domínios.
2. **Levantamento de Requisitos**: Definição clara das expressões-chave de restrição etária e avisos de risco, de forma que correspondam estritamente às disposições legais.
3. **Modelagem do Sistema**: Criação de um fluxograma e definição do fluxo de processamento desde o carregamento das páginas até o salvamento dos resultados.
4. **Desenvolvimento Iterativo**: Abordagem iterativa permitindo ajustes progressivos conforme os testes identificavam pontos de melhoria.
5. **Validação dos Dados**: Processamento e normalização dos textos extraídos, com análise de similaridade para compensar eventuais inconsistências causadas por imagens ou formatações diferenciadas.

## Desenvolvimento do Software

### Visão Geral da Arquitetura

O sistema foi concebido com uma arquitetura modular e escalável, composta por:

- **API baseada em Fastify**: Responsável por gerenciar as requisições e fornecer um painel de controle para a execução manual ou agendada dos processos.
- **Banco de Dados MySQL**: Utilizado para persistência dos dados, com acesso facilitado pelo ORM TypeORM.
- **Gerenciamento de Filas com Redis e Bull**: Controla o processamento assíncrono das tarefas de scraping e análise.
- **Serviço de OCR**: Implementado em Python utilizando Flask para comunicação entre os componentes, garantindo a extração precisa dos textos das imagens.

### Tecnologias e Ferramentas

- **Linguagem Principal**: TypeScript
- **Runtime**: Bun – devido à sua alta performance e inicialização rápida.
- **Biblioteca de Web Scraping**: Puppeteer
- **OCR**: PaddleOCR
- **Agendamento de Tarefas**: Cron Jobs configurados diretamente na aplicação e armazenados no banco de dados.
- **Exportação de Dados**: Biblioteca ExcelJS para geração de relatórios em formato XLSX.
- **Estrutura HTTP**: Fastify, com rotas inspiradas em Next.js para otimizar a modularidade e a organização das funcionalidades.

### Fluxo de Processamento da Aplicação

O fluxo lógico do sistema é composto por diversas etapas:

1. **Carregamento da Página (LoadPage)**: A aplicação aguarda o carregamento total dos elementos da página para garantir que todos os dados estejam disponíveis para análise.
2. **Mapeamento (Scanner)**: Varredura completa do DOM para identificar todos os elementos que possam conter as informações de interesse.
3. **Processamento OCR**: Análise das imagens capturadas para extração de textos, seguida de normalização (remoção de espaços, conversão para minúsculas, remoção de acentos) para facilitar a comparação com as expressões-chave.
4. **Análise do HTML**: Verificação detalhada dos textos presentes no código fonte, considerando propriedades como cor, contraste, posição e visibilidade.
5. **Armazenamento dos Dados (Save)**: Persistência dos dados processados no banco de dados para futuras consultas e geração de relatórios.

## Dependências e Solução de Problemas

Para a execução correta do projeto, certifique-se de instalar todas as dependências necessárias e de configurar seu ambiente conforme os requisitos listados abaixo.

### WSL2 (Windows Subsystem for Linux 2)
Se você estiver utilizando o WSL2, siga as instruções:
```sh
# Windows WSL2: https://www.tensorflow.org/install/pip?hl=pt-br#windows-wsl2_1
# Instalação do CUDA: https://developer.nvidia.com/cuda-downloads

sudo apt install nvidia-cuda-toolkit
```

### API Typescript
Para preparar o ambiente da API escrita em TypeScript, utilize os seguintes comandos:
```sh
sudo apt update && sudo apt install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
```

### API Python
Para configurar o ambiente Python da API, siga os passos abaixo:
```sh
apt install python3.10 python3.10-venv

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

# Para WSL2, pode ser necessário:
# export LD_LIBRARY_PATH=/usr/lib/wsl/lib:$LD_LIBRARY_PATH
# source ~/anaconda3/etc/profile.d/conda.sh
python3 api.py
```

### Salvando as Bibliotecas Atuais
Para gerar um arquivo com as versões das bibliotecas instaladas:
```sh
pip freeze > requirements.txt
```

### Correção de Erros Comuns

#### Erro: [job.id is null]
Em caso de erro relacionado a `job.id is null`, consulte:
```sh
# https://stackoverflow.com/questions/33115325/how-to-set-redis-max-memory
```

#### Erro: Unable to connect. Is the computer able to access the url
Caso ocorra erro de conexão, verifique:
```sh
# https://github.com/oven-sh/bun/issues/1425
```

## Limitações e Desafios

Durante o desenvolvimento, foram identificadas algumas limitações que podem afetar o desempenho e a eficiência da ferramenta:

- **Variação de Formatos e Layouts**: Diversas formas de apresentação das cláusulas podem dificultar o reconhecimento preciso, especialmente quando as informações estão fragmentadas em múltiplas tags ou compostas por imagens de baixa resolução.
- **Medidas Anti-Scraping**: Sítios que utilizam CAPTCHAs, bloqueios de IP e outras técnicas para evitar scraping podem exigir estratégias adicionais, como o uso de proxies ou atrasos entre requisições.
- **Limitações do OCR**: Dificuldades em interpretar textos em imagens com baixa qualidade ou fontes atípicas podem comprometer a precisão da extração dos textos.
- **Interação do Usuário**: Conteúdos que dependem de ações como cliques em botões ("Mostrar mais") não são processados automaticamente, limitando a abrangência da análise.

## Considerações Finais e Aprimoramentos Futuros

O desenvolvimento desta ferramenta representa um avanço significativo no monitoramento das plataformas digitais de apostas, contribuindo para a conformidade com as normas e para a promoção de práticas de jogo responsável. Entre os principais pontos destacados, estão:

- A integração de tecnologias modernas (Fastify, Puppeteer, PaddleOCR, Redis e Bull) que proporcionam uma solução robusta e escalável.
- A abordagem iterativa que permitiu ajustes e melhorias contínuas ao longo do desenvolvimento.

### Aprimoramentos Futuros

- **Interface de Usuário Intuitiva**: Desenvolvimento de um dashboard que facilite o monitoramento e a interação com a ferramenta.
- **Otimização do OCR**: Ajustes para melhorar a precisão na extração textual, sobretudo em imagens de baixa qualidade ou com formatações desafiadoras.
- **Reconhecimento Personalizado de Elementos Gráficos**: Criação de modelos dedicados para identificar de forma mais precisa os elementos gráficos que contenham as cláusulas obrigatórias.
- **Execução Distribuída**: Implementação de execução paralela em múltiplas máquinas para aumentar a escalabilidade e eficiência do monitoramento.

## Referências

- **Patel, C., Patel, A., & Patel, D. (2012)**. *Optical character recognition by open source OCR tool tesseract: A case study*. [Link para o PDF](https://www.academia.edu/download/100190454/3e47cc647c47a1a249e1103047dd5b002b5a.pdf)
- **Khder, M. A. (2021)**. *Web scraping or web crawling: State of art, techniques, approaches and application*. [Link para o PDF](http://www.i-csrs.org/Volumes/ijasca/2021.3.11.pdf)
- **Keller, M. S. (1999)**. *Take command: cron: Job scheduler*. [Link para a publicação](https://dl.acm.org/doi/fullHtml/10.5555/327966.327981)
- **Indra, J., & Sarjono, H. (2010)**. *Queue Analysis System For Improving Efficiency Of Service*. [Link para o PDF](https://pdfs.semanticscholar.org/55ce/cc3fe41aa3c2c2d152c4cfe799115adc6b0a.pdf)
- **CONAR – Anexo X Publicidade de Apostas**. [Link para o documento](http://www.conar.org.br/pdf/CONAR-ANEXO-X-PUBLICIDADE-APOSTAS-dezembro-2023.pdf)

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

*Desenvolvido pelo Instituto Brasileiro de Ensino, Desenvolvimento e Pesquisa (IDP) – Campus Asa Norte em 2024.*

</div>
