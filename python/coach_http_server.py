"""Restricted local HTTP server for the Charybdis coach.

Only the coach's static files and its live state JSON are exposed. The old
server used the parent of all Charybdis repositories as its document root,
which unintentionally made the entire Windows user profile web-readable.
"""
from __future__ import annotations

import argparse
import http.server
import mimetypes
import os
from pathlib import Path
import posixpath
import sys
from urllib.parse import unquote, urlsplit


COACH_PREFIX = "/charybdis-coach/"
STATE_ROUTE = "/charybdis-tools/runtime/charybdis_state.json"
MAX_PATH_LENGTH = 2048


def _is_within(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


class CoachRequestHandler(http.server.BaseHTTPRequestHandler):
    server_version = "CharybdisCoach"
    sys_version = ""

    def __init__(self, *args, coach_dir: Path, state_file: Path, release: str = "", **kwargs):
        self.coach_dir = coach_dir.resolve()
        self.state_file = state_file.resolve()
        self.release = release
        super().__init__(*args, **kwargs)

    def _send_security_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        if self.release:
            self.send_header("X-Charybdis-Release", self.release)

    def end_headers(self) -> None:
        self._send_security_headers()
        super().end_headers()

    def _valid_host(self) -> bool:
        host = self.headers.get("Host", "")
        port = self.server.server_address[1]
        return host.lower() in {
            f"127.0.0.1:{port}",
            f"localhost:{port}",
            f"[::1]:{port}",
        }

    def _resolve_route(self) -> Path | None:
        if not self._valid_host() or len(self.path) > MAX_PATH_LENGTH:
            return None

        try:
            raw_path = unquote(urlsplit(self.path).path, errors="strict")
        except (UnicodeDecodeError, ValueError):
            return None

        if "\x00" in raw_path or "\\" in raw_path:
            return None
        if raw_path == STATE_ROUTE:
            return self.state_file
        if not raw_path.startswith(COACH_PREFIX):
            return None

        relative = raw_path[len(COACH_PREFIX) :]
        if not relative:
            relative = "index.html"
        normalized = posixpath.normpath(relative)
        if normalized in {".", ".."} or normalized.startswith("../"):
            return None

        candidate = (self.coach_dir / Path(normalized)).resolve()
        if not _is_within(candidate, self.coach_dir):
            return None
        return candidate

    def _serve(self, include_body: bool) -> None:
        path = self._resolve_route()
        if path is None or not path.is_file():
            self.send_error(http.HTTPStatus.NOT_FOUND)
            return

        try:
            data = path.read_bytes() if include_body else None
            size = len(data) if data is not None else path.stat().st_size
        except OSError:
            self.send_error(http.HTTPStatus.NOT_FOUND)
            return

        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        if path == self.state_file:
            content_type = "application/json"
        self.send_response(http.HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(size))
        self.end_headers()
        if data is not None:
            try:
                self.wfile.write(data)
            except OSError:
                pass

    def do_GET(self) -> None:  # noqa: N802 - stdlib API
        self._serve(include_body=True)

    def do_HEAD(self) -> None:  # noqa: N802 - stdlib API
        self._serve(include_body=False)

    def do_POST(self) -> None:  # noqa: N802 - stdlib API
        self.send_error(http.HTTPStatus.METHOD_NOT_ALLOWED)

    def log_message(self, format: str, *args) -> None:  # noqa: A002 - stdlib signature
        sys.stderr.write(f"{self.client_address[0]} - {format % args}\n")


class CoachHTTPServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def create_server(
    bind: str,
    port: int,
    coach_dir: Path,
    state_file: Path,
    release: str = "",
) -> CoachHTTPServer:
    def handler(*args, **kwargs):
        return CoachRequestHandler(
            *args,
            coach_dir=coach_dir,
            state_file=state_file,
            release=release,
            **kwargs,
        )

    return CoachHTTPServer((bind, port), handler)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("port", type=int)
    ap.add_argument("--bind", default="127.0.0.1")
    ap.add_argument("--coach-dir", type=Path, required=True)
    ap.add_argument("--state-file", type=Path, required=True)
    ap.add_argument("--release", default="")
    args = ap.parse_args()

    if args.bind not in {"127.0.0.1", "::1", "localhost"}:
        ap.error("--bind must be a loopback address")
    coach_dir = args.coach_dir.resolve()
    state_file = args.state_file.resolve()
    if not coach_dir.is_dir():
        ap.error(f"coach directory does not exist: {coach_dir}")
    state_file.parent.mkdir(parents=True, exist_ok=True)

    with create_server(args.bind, args.port, coach_dir, state_file, args.release) as httpd:
        print(
            f"Serving {coach_dir} at http://{args.bind}:{args.port}{COACH_PREFIX}",
            file=sys.stderr,
        )
        httpd.serve_forever()
    return os.EX_OK


if __name__ == "__main__":
    sys.exit(main())
