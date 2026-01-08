import os
import signal
from redis import Redis
from rq import Worker, Queue, Connection

from app.core.config import get_settings
from app.services.job_updater import update_job_status


def run_worker():
    settings = get_settings()
    redis_conn = Redis.from_url(settings.redis_url)
    listen = [settings.rq_default_queue]

    with Connection(redis_conn):
        worker = Worker(map(Queue, listen))

        def on_started(job, *args, **kwargs):
            update_job_status(job.get_id(), 'started')

        def on_finished(job, *args, **kwargs):
            # Try to persist result as text if short; otherwise store simple marker
            result = None
            if job.result is not None:
                result = str(job.result)[:200000]
            update_job_status(job.get_id(), 'finished', result)

        def on_failed(job, *args, **kwargs):
            update_job_status(job.get_id(), 'failed', str(job.exc_info) if job.exc_info else None)

        worker.push_exc_handler(lambda job, *a, **k: on_failed(job))
        worker.on_success = lambda job, *a, **k: on_finished(job)
        # RQ does not have a started hook by default; we can update when dequeued via custom middleware if needed

        worker.work()


if __name__ == "__main__":
    run_worker()



