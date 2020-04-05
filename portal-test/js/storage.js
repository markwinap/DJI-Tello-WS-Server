function storage(e) {
  switch (e.action) {
    case 'db-clear':
      return db
        .table('chat')
        .clear()
        .catch(err => console.log(err));
    case 'db-set':
      return db
        .table('chat')
        .put(e?.key)
        .catch(err => console.log(err));
    case 'db-get':
      return db
        .table('chat')
        .get(e?.key)
        .catch(err => console.log(err));
    case 'db-delete':
      return db
        .table('chat')
        .delete(e?.key)
        .catch(err => console.log(err));
    case 'local-clear':
      localStorage.clear();
      return true;
    case 'local-set':
      localStorage.setItem(e?.key, e?.value);
      return true;
    case 'local-get':
      return localStorage.getItem(e?.key);
    case 'local-delete':
      localStorage.removeItem(e?.key);
      return true;
    case 'session-clear':
      sessionStorage.clear();
      return true;
    case 'session-set':
      sessionStorage.setItem(e?.key, e?.value);
      return true;
    case 'session-get':
      return sessionStorage.getItem(e?.key);
    case 'session-delete':
      sessionStorage.removeItem(e?.key);
      return true;
    default:
      return false;
  }
}
