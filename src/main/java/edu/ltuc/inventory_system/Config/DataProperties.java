package edu.ltuc.inventory_system.Config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix ="spring.properties")
public class DataProperties {
    private String baseUrl;
}
