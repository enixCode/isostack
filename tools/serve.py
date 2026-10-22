# Test server: the project at the root, a second folder under /recette/, on a free port printed first.
# Usage: python -I tools/serve.py <projectDir> <extraDir>
import functools, http.server, os, sys

PROJECT, EXTRA = sys.argv[1], sys.argv[2]

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.svg': 'image/svg+xml'}

    def translate_path(self, path):
        if path.startswith('/recette/'):
            return os.path.join(EXTRA, path.split('?')[0][len('/recette/'):])
        return super().translate_path(path)

    def log_message(self, *args):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=PROJECT))
print(server.server_address[1], flush=True)
server.serve_forever()
