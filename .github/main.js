name: Update Filter Lists

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_ENV: production

jobs:
  cgps:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          repository: "mrrfv/cloudflare-gateway-pihole-scripts"
          ref: "v1"

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".node-version"

      - name: Install npm dependencies
        run: npm ci

      - name: Download allowlists
        run: npm run download:allowlist
        env:
          ALLOWLIST_URLS: ${{ vars.ALLOWLIST_URLS }}

      - name: Download blocklists
        run: npm run download:blocklist
        env:
          BLOCKLIST_URLS: ${{ vars.BLOCKLIST_URLS }}

      - name: Delete old rules and lists
        run: npm run cloudflare-delete
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_LIST_ITEM_LIMIT: ${{ secrets.CLOUDFLARE_LIST_ITEM_LIMIT }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}

      - name: Create new rules and lists
        run: npm run cloudflare-create
        env:
          BLOCK_PAGE_ENABLED: ${{ vars.BLOCK_PAGE_ENABLED }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_LIST_ITEM_LIMIT: ${{ secrets.CLOUDFLARE_LIST_ITEM_LIMIT }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}

      - name: Send ping request
        if: env.PING_URL != ''
        run: |
          curl "${{ env.PING_URL }}"
        env:
          PING_URL: ${{ secrets.PING_URL }}

  keepalive:
    runs-on: ubuntu-latest
    permissions:
      actions: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: gautamkrishnar/keepalive-workflow@v2
