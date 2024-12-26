import { object, string } from 'yup';

const UserSchema = object({
  display_name: string(),
  username: string().required('Required'),
  email: string().email().required('Required'),
  mode: string().required('Required'),
  passcode: string().when(['mode'], {
    is: (mode: string) => mode === 'oauth',
    then: (schema) => schema.required('Passcode is required when mode is oauth'),
    otherwise: (schema) => schema.notRequired(),
  }),
  picture: string(),
  created_at: string().required('Required'),
  modified_at: string().nullable(),
});

export default UserSchema;
