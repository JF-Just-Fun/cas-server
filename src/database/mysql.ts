import { DataSourceOptions, DataSource } from 'typeorm';
import * as Model from '../models';

const options: DataSourceOptions = {
  name: 'mysql',
  type: 'mysql',
  host: process.env.MYSQL_HOST, // '101.43.5.99'
  port: parseInt(process.env.MYSQL_PORT), // 13333,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_ROOT_PASSWORD, // 'DUANcas4815883',
  database: process.env.MYSQL_DATABASE, // 'cas',
  // /* Indicates if database schema should be auto created on every application launch. */
  synchronize: process.env.NODE_ENV === 'production' ? false : true,
  logging: false,
  entities: Object.values(Model),
};

const dataSource = new DataSource(options);
dataSource.initialize().then(
  (dataSource) => console.log('=> database connected!'),
  (error) => {
    // code = 'ER_BAD_DB_ERROR' 无数据库
    // code = 'ER_ACCESS_DENIED_ERROR' 密码错误
    Object.keys(error).forEach((key) => {
      console.log('=> ', key, error[key]);
    });
  },
);

export default dataSource;
