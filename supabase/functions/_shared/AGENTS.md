# _shared rules
- Cart tool actions carry per-product `mention` and model-owned `qty_mode`+`amount`; the resolver converts relative/absolute quantities without a second model override, so compound commands retain independent quantities.
- Cart disambiguation on app surfaces is multi-select (`multi` replies merged into one choice); Telegram keeps the synthetic «همه» choice; a cart command mid-questionnaire pauses the flow instead of resetting it.
