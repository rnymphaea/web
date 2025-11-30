all:
	npm install && cd frontend && npm install && npm run build && cd ../backend && npm install && npm run build && cd ../node_modules/broker-simulator-rnymphaea/backend && npm install && npm run build && cd ../frontend && npm install && npm run build

admin-frontend:
	cd node_modules/broker-simulator-rnymphaea/frontend && npm run start

admin-backend:
	cd node_modules/broker-simulator-rnymphaea/backend && npm run start

clean:
	rm -rf node_modules package-lock.json && cd backend && rm -rf dist node_modules package-lock.json && cd ../frontend && rm -rf build node_modules package-lock.json && cd ../e2e && rm -rf node_modules package-lock.json 

