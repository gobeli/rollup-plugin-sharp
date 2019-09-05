export const promise = (fn: Function, ...args): Promise<any> => 
  new Promise((resolve, reject) => 
    fn(...args, (err, res) =>
      err ? reject(err) : resolve(res)
    )
  );
