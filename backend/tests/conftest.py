import os

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://theia:theia@localhost:5433/theia_test",
)

os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["DATABASE_URL_SYNC"] = TEST_DATABASE_URL.replace("+asyncpg", "")
os.environ["ENVIRONMENT"] = "test"
os.environ["PAYMENT_MODE"] = "sandbox"

import psycopg2
import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from app.main import app
from app.testing.demo_catalog import BRANDS, CATEGORIES, COLLECTIONS, PRODUCTS

SYNC_TEST_URL = os.environ["DATABASE_URL_SYNC"]
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _connect():
    return psycopg2.connect(SYNC_TEST_URL)


@pytest.fixture(scope="session", autouse=True)
def database():
    maintenance_url = SYNC_TEST_URL.rsplit("/", 1)[0] + "/theia"
    conn = psycopg2.connect(maintenance_url)
    conn.autocommit = True
    with conn.cursor() as cursor:
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'theia_test'")
        if not cursor.fetchone():
            cursor.execute("CREATE DATABASE theia_test")
    conn.close()

    alembic_cfg = Config(os.path.join(BACKEND_DIR, "alembic.ini"))
    alembic_cfg.set_main_option(
        "script_location", os.path.join(BACKEND_DIR, "alembic")
    )
    command.upgrade(alembic_cfg, "head")


@pytest.fixture(autouse=True)
def clean_tables(database):
    with _connect() as conn:
        conn.autocommit = True
        with conn.cursor() as cursor:
            cursor.execute(
                "TRUNCATE collection_products, collections, cart_items, carts, payments, quote_requests, order_items, orders, products, brands, categories, users RESTART IDENTITY CASCADE"
            )
    yield


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


def seed_products():
    def _adapt(row):
        return [
            psycopg2.extras.Json(value)
            if isinstance(value, list) and value and isinstance(value[0], dict)
            else value
            for value in row
        ]

    with _connect() as conn:
        with conn.cursor() as cursor:
            cursor.executemany(
                "INSERT INTO categories (id, name, slug) VALUES (%s, %s, %s)",
                CATEGORIES,
            )
            cursor.executemany(
                "INSERT INTO brands (id, name, slug) VALUES (%s, %s, %s)",
                BRANDS,
            )
            cursor.executemany(
                """
                INSERT INTO products
                    (id, name, slug, description, price_gs, price_usd, available,
                     orderable, certifications, images, specifications,
                     category_id, brand_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                [_adapt(row) for row in PRODUCTS],
            )
            for ctype, links in COLLECTIONS:
                cursor.execute(
                    "INSERT INTO collections (type) VALUES (%s) RETURNING id",
                    (ctype,),
                )
                collection_id = cursor.fetchone()[0]
                for product_id, position in links:
                    cursor.execute(
                        "INSERT INTO collection_products (collection_id, product_id, position) "
                        "VALUES (%s, %s, %s)",
                        (collection_id, product_id, position),
                    )
        conn.commit()


@pytest.fixture()
def seeded(client):
    seed_products()
    return client
