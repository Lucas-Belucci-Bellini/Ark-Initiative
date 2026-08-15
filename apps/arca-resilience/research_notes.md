# Pesquisa de apoio — protocolos ARCA

## Comunicação offline e integridade de mensagem

- **IETF RFC 9171 (Bundle Protocol v7):** define uma arquitetura de rede tolerante a atraso para ambientes com conectividade intermitente, grandes atrasos variáveis e altas taxas de erro. O protocolo trabalha como uma sobreposição *store-carry-forward* e pode aproveitar conectividade programada, prevista, oportunista ou unidirecional.
- **IETF RFC 9172 (BPSec):** acrescenta serviços de integridade e confidencialidade ao Bundle Protocol. A fonte também destaca que, em redes *store-carry-forward*, devem ser considerados dados em repouso, consumo não autorizado de armazenamento e operação sem contato regular com uma autoridade centralizada.
- **CISA Zero Trust:** recomenda abandonar a confiança baseada somente na localização de rede, assumindo ambiente comprometido e aplicando verificação contínua, privilégio mínimo e controles granulares centrados em usuários, dispositivos, dados e recursos.

## Dados humanitários e coordenação

- **OCHA Data Responsibility Guidelines:** trata responsabilidade de dados como gestão segura, ética e eficaz de dados pessoais e não pessoais para resposta operacional; apresenta necessidade de classificação de sensibilidade e estrutura de responsabilização.
- **OCHA Civil-Military Coordination:** coordenação entre atores civis e militares deve preservar acesso e proteção de pessoas, definir divisão clara de tarefas, reduzir mal-entendidos e manter coerência com princípios humanitários.

## Combustível, energia e manutenção

- **UNGSC:** a integração entre um sistema eletrônico de gestão de combustível e monitoramento de infraestrutura remota permite relacionar consumo, validação de emissões, desempenho de geradores, necessidades de manutenção, redução de indisponibilidade e transparência.
- **WFP:** operações humanitárias em ambientes de difícil acesso utilizam pré-posicionamento, depósitos, transporte terrestre/aéreo, telecomunicações de emergência, engenharia e serviços compartilhados para apoiar a resposta.

## Decisões de projeto derivadas

1. Usar uma malha com vários portadores — rádio autorizado, satélite, rede local e transporte físico de dados — sob uma única fila de mensagens tolerante a atraso.
2. Assinar e classificar cada mensagem antes da transmissão; manter payload sensível cifrado de ponta a ponta e metadados mínimos para encaminhamento.
3. Tratar cada dispositivo offline como um enclave: identidade de dispositivo, função de missão, permissões mínimas, armazenamento cifrado, logs encadeados e janela de credencial limitada.
4. Governar combustível por previsão de demanda, estoque em camadas, medição de emissão/recebimento, amostragem de qualidade, reconciliação, reserva para retorno/resgate e telemetria de geradores e viaturas.
5. Estruturar manutenção em quatro níveis: inspeção do operador, célula avançada, oficina regional e reparo/depot especializado; acionar reabastecimento de peças pela criticidade e risco de imobilização, não por calendário fixo.

## Fontes

1. https://datatracker.ietf.org/doc/rfc9171/
2. https://datatracker.ietf.org/doc/rfc9172/
3. https://centre.humdata.org/the-ocha-data-responsibility-guidelines/
4. https://www.cisa.gov/topics/cybersecurity-best-practices/zero-trust
5. https://www.unocha.org/civil-military-coordination
6. https://www.ungsc.org/news/future-fuel-management-un-operations
7. https://www.wfp.org/humanitarian-support-and-services
