from typing import Annotated
from arq import ArqRedis
from fastapi import Depends, Request

async def get_arq_pool(request: Request) -> ArqRedis | None:
    return getattr(request.app.state, "arq_pool", None)

ArqPool = Annotated[ArqRedis | None, Depends(get_arq_pool)]
