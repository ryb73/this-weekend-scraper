node index.js
if [[ $? -eq 0 ]]; then
  bunyan log/`ls -t log | head -1`
fi
