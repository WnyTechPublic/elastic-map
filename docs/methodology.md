# 모델링 방법론

## 목적

Elastic의 기술적·시장적 위치를 하나의 순위나 범주로 단순화하지 않고, 기술 구조와 사용 맥락에 따라 탐색할 수 있도록 한다.

## Competency questions

초기 모델은 다음 질문에 답할 수 있어야 한다.

1. Elasticsearch는 어떤 워크로드와 아키텍처 패턴에 연결되는가?
2. PostgreSQL·MongoDB와 Elasticsearch는 언제 보완하고 언제 겹치는가?
3. ClickHouse·Druid와 Elasticsearch의 실시간 분석 영역은 어떻게 중첩되는가?
4. Databricks Lakehouse와 Elasticsearch는 데이터 아키텍처의 어느 역할을 맡는가?
5. Splunk·Datadog과의 비교는 엔진, 플랫폼, 솔루션 중 어느 층위에서 이루어지는가?
6. System of Record, Search, Analytics 역할은 어떤 기술에 연결되는가?

## 개념 층위

- `Workload`: 처리 목적과 질의 특성
- `ArchitecturePattern`: 데이터 표현·저장·배치 구조
- `Technology`: 엔진, 데이터베이스, 제품 또는 플랫폼
- `SystemRole`: 전체 아키텍처 안에서 담당하는 역할
- `PositioningClaim`: 맥락과 기준일을 가진 시장·기술 관계 분석

## 관계 구분

### 구조적 관계

- `optimizedFor`
- `supportsWorkload`
- `implementsPattern`
- `typicalRole`
- `commonlyComplements`

### 포지셔닝 주장

`PositioningClaim`은 `subject`, `object`, `relationType`, `context`, `assessment`, `asOf`를 필수로 갖는다. 경쟁·대체·중첩은 제품의 영구 속성으로 선언하지 않는다.

## 근거 정책

- 정의와 제품 특성은 공식 문서를 우선한다.
- 벤더의 성능 주장은 독립 검증 없이 일반 사실로 확장하지 않는다.
- 위앤유텍의 해석은 `assessment`에만 기록한다.
- 시장 관계는 기준일을 기록하고 정기적으로 재검토한다.
- 출처가 바뀌거나 사라지면 대체 공식 문서와 검토일을 갱신한다.

## 향후 확장 후보

OpenSearch, Kafka, Snowflake, BigQuery, 데이터 웨어하우스, 벡터 데이터베이스, OpenTelemetry를 검토하되 초기 질문에 필요한 범위부터 확장한다.
