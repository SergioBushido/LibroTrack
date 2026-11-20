import { NavigatorScreenParams, CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { Book } from './Book';

export type BibliotecaStackParamList = {
  BooksList: undefined;
  BookDetail: { id?: string; book: Book };
  EditBook: { book: Book };
};

export type AddStackParamList = {
  AddBookForm: { title?: string; author?: string; coverUrl?: string } | undefined;
  ImportBooks: undefined;
};

export type RootTabParamList = {
  Biblioteca: NavigatorScreenParams<BibliotecaStackParamList> | undefined;
  Stats: undefined;
  Añadir: NavigatorScreenParams<AddStackParamList> | undefined;
  Internet: undefined;
};

export type BibliotecaNavigationProp = CompositeNavigationProp<
  StackNavigationProp<BibliotecaStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

export type AddStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AddStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

export type RootTabNavigationProp = BottomTabNavigationProp<RootTabParamList>;

export type BookDetailRouteProp = RouteProp<BibliotecaStackParamList, 'BookDetail'>;
export type EditBookRouteProp = RouteProp<BibliotecaStackParamList, 'EditBook'>;
export type AddBookRouteProp = RouteProp<AddStackParamList, 'AddBookForm'>;
