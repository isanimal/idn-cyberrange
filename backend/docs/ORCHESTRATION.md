# Orchestration

## Driver abstraction
- `LabDriverInterface`
- `LocalDockerDriver` for runtime
- `FakeDockerDriver` for tests
- `FutureK8sDriver` placeholder

## Runtime flow
1. Activate instance allocates deterministic port from DB (`port_allocations`), range `20000-40000`.
2. Driver writes compose file under `${DOCKER_LAB_RUNTIME_ROOT}/{instance_id}/docker-compose.yml`.
3. Driver executes `docker compose up -d`.
4. Metadata is stored in:
- `lab_instances.runtime_metadata`
- `lab_instance_runtimes` table

## Stop / Restart / Upgrade
- Stop: `docker compose down -v`, release assigned port.
- Restart: `docker compose restart`.
- Upgrade:
- `RESET`: clears notes/progress/score and re-provisions target version.
- `IN_PLACE`: allowed only when compatibility checks pass (same family + same base/internal port).

## Cleanup strategy
- Force-stop and deactivate both release `port_allocations`.
- Destroy removes runtime directory and compose artifacts.
- Recommended production policy: scheduled cleanup job for abandoned/expired instances and stale allocations.
