import { object, string } from 'yup';

const UserSchema = object({
  display_name: string(),
  username: string().required('Required'),
  email: string().email().required('Required'),
  passcode: string().required('Required'),
  created_at: string().required('Required'),
  modifedAt: string().nullable(),
});

export default UserSchema;
