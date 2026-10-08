# _shared rules
- Cart tool actions carry `mention` (the user's words for that product) and `qty_mode`+`amount`; the resolver matches each action only against its own mention and a Jev per-action direction judgment (`judgeQtyModes`) overrides the model, so compound commands never leak names/ordinals and "add one" never becomes quantity=1.
- Cart disambiguation on app surfaces is multi-select (`multi` replies merged into one choice); Telegram keeps the synthetic «همه» choice; a cart command mid-questionnaire pauses the flow instead of resetting it.
