# Fontes públicas do painel operacional ARCA

## GDACS

Endpoint validado: `https://www.gdacs.org/gdacsapi/api/Events/geteventlist/latest`.

O contrato OpenAPI público do GDACS informa os parâmetros `eventlist`, `alertlevel`, `datemodified`, `country`, `severity`, `pageSize` e `pageNumber`. A implementação ARCA consulta eventos `EQ;TC;FL;WF;VO;DR`, com página de até 80 elementos, e preserva `eventtype`, `eventid`, `alertlevel`, `country`, geometria, datas de observação/modificação e URLs do relatório.

Referências: [Swagger do GDACS](https://www.gdacs.org/gdacsapi/swagger/index.html) e [GDACS](https://gdacs.org/).

## USGS

Endpoint validado: `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time&limit=80&minmagnitude=4.5`.

O catálogo aceita retorno GeoJSON e registra campos de magnitude, horário, atualização, local, URL, profundidade e estado de revisão. O ARCA usa a fonte apenas para exibir eventos e contexto sísmico público; não declara segurança, evacuação ou despacho.

Referência: [USGS Earthquake Catalog API](https://earthquake.usgs.gov/fdsnws/event/1/).

## Histórico agregado de resgates

Foram analisadas as listas públicas de incidentes de busca e resgate do National Park Service, disponíveis pela página FOIA. Somente métricas agregadas no período de 2013 a 2020 são armazenadas no ARCA: 1.565 registros de busca terrestre, 370 de busca aquática e 15.837 outras classificações publicadas, sem números de incidente, nomes ou dados individuais.

Referência: [NPS FOIA — Search and Rescue](https://www.nps.gov/aboutus/foia/foia-frd.htm).

## Limite operacional

O cache é atualizado sob demanda, com janela máxima de cinco minutos. Falhas de fonte mantêm o último cache e são comunicadas na interface. Dados públicos de risco e histórico agregado são contextos informacionais; autoridade humana e órgãos competentes continuam responsáveis por avisos oficiais e respostas de emergência.
