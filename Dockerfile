#############
# Global vars
#############

ARG workDir=/srv/loadgen

############
# Build step
############

FROM node:12-alpine as builder

ARG workDir
ENV workDir=$workDir
WORKDIR ${workDir}

COPY . .

RUN npm i

# Run tslint
RUN ${workDir}/node_modules/.bin/tslint --project ./tsconfig.json

# Compile tsc
RUN ${workDir}/node_modules/typescript/bin/tsc --project ./tsconfig.json --outDir ./out

############
# Prod build
############

FROM node:12-alpine as prod

ARG workDir
ENV workDir=$workDir
WORKDIR ${workDir}

# Install production modules
COPY package*.json ${workDir}/
RUN npm ci --prod

COPY --from=builder /${workDir}/out ./

EXPOSE 3000

USER node

ENTRYPOINT node ${workDir}/index.js

