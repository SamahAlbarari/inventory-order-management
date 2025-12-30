package edu.ltuc.inventory_system.Exceptions;

public class UserExistException extends RuntimeException {
  public UserExistException(String message) {
    super(message);
  }
}
