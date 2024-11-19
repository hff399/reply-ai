import ky from "ky"

const kyClient = ky.create({
    prefixUrl: 'http://localhost:3001/api',
    hooks: {
      beforeRequest: [
        (request) => {
          const token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('access-token='))
            ?.split('=')[1];
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        },
      ],
    },
  });

export default kyClient