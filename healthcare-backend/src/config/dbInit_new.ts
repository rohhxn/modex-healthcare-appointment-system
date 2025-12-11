// MongoDB automatically creates collections on first insert
// No schema initialization needed
export default async function initializeDatabase() {
  console.log('✅ MongoDB ready - collections will be created automatically');
}
