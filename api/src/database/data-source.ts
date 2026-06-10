import { DataSource } from 'typeorm';
import { getTypeOrmOptions } from './typeorm.options';

export default new DataSource(getTypeOrmOptions());
