install:
	# Install Go dependencies
	cd server && go mod tidy

	# Install Node.js dependencies for frontend
	cd gt7-dashboard-web && npm install

run-server-prod:
	# Run the Go backend server in production mode
	cd server && go run server.go

run-frontend-prod:
	# Build the React frontend for production and serve it
	cd gt7-dashboard-web && npm run build && npm run serve

start-prod:
	# Run both frontend and backend in production concurrently
	npm install -g concurrently # Ensure concurrently is installed globally
	concurrently "make run-server-prod" "make run-frontend-prod"

run-server-dev:
	# Run the Go backend server in development mode (with live reload if needed)
	cd server && go run server.go

run-frontend-dev:
	# Run the React frontend in development mode (with hot-reload)
	cd gt7-dashboard-web && npm run dev

start-dev:
	# Run both frontend and backend in development concurrently
	npm install -g concurrently # Ensure concurrently is installed globally
	concurrently "make run-server-dev" "make run-frontend-dev"

down:
	# Stop all running processes started by make start
	pkill -f "go run server.go" || true
	pkill -f "vite" || true

clean:
	# Remove node_modules and Go build cache
	rm -rf gt7-dashboard-web/node_modules
	go clean -cache -modcache -i -r

rebuild:
	# Clean, install dependencies, and start services in production
	make clean
	make install
	make start-prod