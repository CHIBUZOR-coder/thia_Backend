// Backend: Express.js Example
export const validatoken = async (req, res) => {
  const token = await req.cookies["auth_token"]; // Get the token from HTTP-only cookie

  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  } else if (isTokenExpired(token))
    return res.status(401).send({ message: "token expired" });

  const userRole = decodeToken(token).role; // Decode token and extract role
  res.send({ role: userRole });
};
//