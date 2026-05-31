---
layout: default
title: Home
---

<div class="home-hero">
  <h1>Titan T1-X Guide</h1>
  <p>Exercise instructions, accessory reference, and cable configuration for the Titan T1-X functional trainer.</p>
</div>

{% assign favorites = site.data.settings.favorited_exercises %}
{% if favorites and favorites.size > 0 %}
<section class="home-favorites">
  <div class="home-section-header">
    <h2>Featured Exercises</h2>
    <a href="{{ '/exercises/' | relative_url }}" class="home-section-link">All {{ site.exercises | size }} exercises &rsaquo;</a>
  </div>
  <div class="collection-grid">
    {% assign sorted_exercises = site.exercises | sort: "code" %}
    {% for exercise in sorted_exercises %}
      {% if favorites contains exercise.code %}
      <div class="item-card">
        <a href="{{ exercise.url | relative_url }}" class="item-card__image{% unless exercise.photos and exercise.photos.size > 0 %} item-card__image--placeholder{% endunless %}">
          {% if exercise.photos and exercise.photos.size > 0 %}
            <img src="{{ exercise.photos[0] | relative_url }}" alt="{{ exercise.title }}" loading="lazy">
          {% else %}
            &#9634;
          {% endif %}
        </a>
        <div class="item-card__body">
          <div class="item-card__meta">
            {% if exercise.code %}<span class="item-code">{{ exercise.code }}</span>{% endif %}
            {% for muscle in exercise.muscles %}
              <a href="{{ '/exercises/' | relative_url }}?muscle={{ muscle | url_encode }}" class="tag">{{ muscle }}</a>
            {% endfor %}
          </div>
          <div class="item-card__title">
            <a href="{{ exercise.url | relative_url }}">{{ exercise.title }}</a>
          </div>
          {% if exercise.description %}
            <p class="item-card__description">{{ exercise.description }}</p>
          {% endif %}
        </div>
      </div>
      {% endif %}
    {% endfor %}
  </div>
</section>
{% else %}
<section class="home-favorites">
  <div class="home-section-header">
    <h2>Exercises</h2>
  </div>
  <div class="empty-state">No favorited exercises. Add exercise codes to <code>_data/settings.yaml</code>.</div>
</section>
{% endif %}

<div class="home-sections">
  <a href="{{ '/accessories/' | relative_url }}" class="home-section-card">
    <h2>Accessories</h2>
    <p>Attachments and handles for the T1.</p>
    <span class="home-section-card__count">{{ site.accessories | size }} accessories</span>
  </a>
  <a href="{{ '/cables/' | relative_url }}" class="home-section-card">
    <h2>Cables</h2>
    <p>Cable types and configuration reference.</p>
    <span class="home-section-card__count">{{ site.cables | size }} cables</span>
  </a>
</div>
